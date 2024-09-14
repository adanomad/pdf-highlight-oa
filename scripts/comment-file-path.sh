#!/usr/bin/env bash
# scripts/comment-file-path.sh

show_help() {
    echo "Usage: add_file_comments [OPTIONS] [FOLDER]"
    echo "Add or update file path comments at the beginning of specified file types."
    echo
    echo "Options:"
    echo "  --help              Show this help message and exit"
    echo "  --file-types TYPES  Comma-separated list of file extensions to process (default: tsx,ts,sh)"
    echo "  --copy-contents     Copy contents of processed files into a single file (default: false)"
    echo
    echo "If no FOLDER is provided, the script runs from the current working directory."
}

parse_arguments() {
    file_types="tsx,ts,sh"
    copy_contents=false
    target_dir="."

    while [[ $# -gt 0 ]]; do
        case $1 in
        --help | -h)
            show_help
            return 1
            ;;
        --file-types | -f)
            file_types="$2"
            shift 2
            ;;
        --copy-contents | -c)
            copy_contents=true
            shift
            ;;
        *)
            target_dir="$1"
            shift
            ;;
        esac
    done

    IFS=',' read -ra file_types <<<"$file_types"
    target_dir_abs=$(realpath "$target_dir")
    echo "Target directory: $target_dir_abs"
    echo "File types to process: ${file_types[*]}"
    echo "Copy contents: $copy_contents"
}

add_file_comment() {
    local file="$1"
    local root_dir=$(find_package_json_dir "$target_dir_abs")
    local relative_path=${file#"$root_dir/"}
    local file_extension="${file##*.}"
    local temp_file=$(mktemp)
    local original_permissions=$(stat -c %a "$file")

    if [[ "$file_extension" == "sh" ]]; then
        local new_comment="# $relative_path"
        local first_line=$(head -n 1 "$file")
        local second_line=$(sed -n '2p' "$file")

        if [[ "$first_line" =~ ^#!/ ]]; then
            if [[ "$second_line" =~ ^#[[:space:]]* ]]; then
                local existing_path=$(echo "$second_line" | sed 's/^#[[:space:]]*//')
                if [[ "$existing_path" != "$relative_path" ]]; then
                    echo "$first_line" >"$temp_file"
                    echo "$new_comment" >>"$temp_file"
                    tail -n +3 "$file" >>"$temp_file"
                    echo "Updated comment in $relative_path (preserving shebang, was: $existing_path)"
                else
                    # echo "No change needed for $relative_path"
                    rm "$temp_file"
                    return
                fi
            else
                echo "$first_line" >"$temp_file"
                echo "$new_comment" >>"$temp_file"
                tail -n +2 "$file" >>"$temp_file"
                echo "Added comment to $relative_path (preserving shebang)"
            fi
        elif [[ "$first_line" =~ ^#[[:space:]]* ]]; then
            local existing_path=$(echo "$first_line" | sed 's/^#[[:space:]]*//')
            if [[ "$existing_path" != "$relative_path" ]]; then
                echo "$new_comment" >"$temp_file"
                tail -n +2 "$file" >>"$temp_file"
                echo "Updated comment in $relative_path (was: $existing_path)"
            else
                # echo "No change needed for $relative_path"
                rm "$temp_file"
                return
            fi
        else
            echo "#!/usr/bin/env bash" >"$temp_file"
            echo "$new_comment" >>"$temp_file"
            cat "$file" >>"$temp_file"
            echo "Added comment and shebang to $relative_path"
        fi
    else
        local new_comment="// $relative_path"
        local first_line=$(head -n 1 "$file")

        if [[ "$first_line" =~ ^//[[:space:]]* ]]; then
            local existing_path=$(echo "$first_line" | sed 's/^\/\/[[:space:]]*//')
            if [[ "$existing_path" != "$relative_path" ]]; then
                echo "$new_comment" >"$temp_file"
                tail -n +2 "$file" >>"$temp_file"
                echo "Updated comment in $relative_path (was: $existing_path)"
            else
                # echo "No change needed for $relative_path"
                rm "$temp_file"
                return
            fi
        else
            echo "$new_comment" >"$temp_file"
            cat "$file" >>"$temp_file"
            echo "Added comment to $relative_path"
        fi
    fi

    # Instead of using mv, use cat and redirect to preserve permissions
    cat "$temp_file" >"$file"
    rm "$temp_file"

    # Restore original permissions
    chmod "$original_permissions" "$file"
}

find_package_json_dir() {
    local current_dir="$1"
    while [[ "$current_dir" != "/" ]]; do
        if [[ -f "$current_dir/package.json" ]]; then
            echo "$current_dir"
            return 0
        fi
        current_dir=$(dirname "$current_dir")
    done
    echo "$1"
    return 1
}

process_files() {
    local files=()
    for ext in "${file_types[@]}"; do
        while IFS= read -r -d '' file; do
            files+=("$file")
        done < <(find "$target_dir_abs" -type f -name "*.$ext" -not -path "*/.*" -not -path "*/node_modules/*" -print0)
    done

    if [[ ${#files[@]} -eq 0 ]]; then
        echo "No matching files found in $target_dir_abs"
        return
    fi

    echo "Processing files..."
    for file in "${files[@]}"; do
        add_file_comment "$file"
    done
    echo "Finished processing files."

    if [[ "$copy_contents" == true ]]; then
        echo "Copying contents to combined file..."
        local combined_file="combined_contents.txt"
        >"$combined_file"
        for file in "${files[@]}"; do
            echo "// File: ${file#"$target_dir_abs/"}" >>"$combined_file"
            cat "$file" >>"$combined_file"
            echo -e "\n\n" >>"$combined_file"
        done
        echo "Contents copied to $combined_file"
    fi
}

if ! parse_arguments "$@"; then
    exit 1
fi

current_dir=$(pwd)
cd "$target_dir_abs" || exit 1

process_files

cd "$current_dir" || exit 1
